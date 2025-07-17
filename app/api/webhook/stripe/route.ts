import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/utils/supabase-admin';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any, // Type assertion to bypass API version checking
});

// Map to store Stripe price IDs to credit amounts
// Update with your actual price IDs - use wildcards to match any part of the price ID
const CREDIT_PACKAGES: {[key: string]: {amount: number, name: string}} = {
  'light': { amount: 2000, name: 'Light Package' },  // Light package: 2000 credits for $19
  'pro': { amount: 6000, name: 'Pro Package' },      // Pro package: 6000 credits for $39
  'ultra': { amount: 20000, name: 'Ultra Package' }  // Ultra package: 20000 credits for $99
};

// These product names should exactly match what's in your Stripe dashboard
const PRODUCT_NAMES: {[key: string]: {amount: number, name: string}} = {
  '2000 Contacts': CREDIT_PACKAGES['light'],
  '6000 Contacts': CREDIT_PACKAGES['pro'],
  '20000 Contacts': CREDIT_PACKAGES['ultra'],
};

// Default fallback for testing
const DEFAULT_CREDITS = 2000;

export async function POST(req: NextRequest) {
  try {
    console.log('New webhook received in /api/webhook/stripe');
    
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature header');
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    console.log('Webhook received with signature starting with:', signature.substring(0, 20));

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      console.error('Body sample:', body.substring(0, 100));
      console.error('Signature:', signature);
      console.error('Secret sample:', process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 5) + '***');
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    console.log(`Webhook event received: ${event.type}`);
    try {
      // Log some safely accessible properties, handling different object types
      const eventObject = event.data.object;
      const objInfo = { 
        type: event.type,
        objectType: typeof eventObject
      };
      
      // Try to add ID if it exists
      if (eventObject && typeof eventObject === 'object' && 'id' in eventObject) {
        console.log('Event data:', JSON.stringify({
          ...objInfo,
          id: eventObject.id
        }));
      } else {
        console.log('Event data (no ID):', JSON.stringify(objInfo));
      }
    } catch (e) {
      console.log('Could not log event data details');
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.succeeded':
        // For direct payment flows
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'charge.succeeded':
        // Alternative way to capture payments
        await handleChargeSucceeded(event.data.object as Stripe.Charge);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('🔍 Processing checkout session completion:', session.id);
    console.log('Session data:', JSON.stringify({
      client_reference_id: session.client_reference_id,
      amount_total: session.amount_total,
      customer_email: session.customer_details?.email
    }));
    
    // Get the necessary data from the session
    const userId = session.client_reference_id;
    
    if (!userId) {
      console.error('⚠️ Missing user ID in checkout session');
      
      // Try to recover with the payment_intent if possible
      if (session.payment_intent) {
        console.log('Attempting to recover from payment intent:', session.payment_intent);
        if (typeof session.payment_intent === 'string') {
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
          await handlePaymentIntentSucceeded(paymentIntent);
          return;
        } else {
          await handlePaymentIntentSucceeded(session.payment_intent);
          return;
        }
      }
      return;
    }
    
    console.log('Processing credits for user:', userId);
    
    // Try to get line items to determine the package
    let creditInfo;
    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
      console.log('Session line items count:', lineItems.data.length);
      
      if (lineItems.data.length) {
        console.log('First line item:', JSON.stringify(lineItems.data[0]));
        
        // Get product details if available
        const productId = lineItems.data[0].price?.product as string;
        if (productId) {
          const product = await stripe.products.retrieve(productId);
          console.log('Product details:', JSON.stringify({
            id: product.id,
            name: product.name
          }));
          
          // Try to match product name to credit package
          for (const [key, value] of Object.entries(CREDIT_PACKAGES)) {
            if (product.name.toLowerCase().includes(key.toLowerCase())) {
              creditInfo = value;
              console.log(`✅ Matched credit package "${key}" from product name:`, product.name);
              break;
            }
          }
        }
        
        // If we couldn't match by product name, try the price description or ID
        if (!creditInfo) {
          const priceDescription = lineItems.data[0].description || '';
          const priceId = lineItems.data[0].price?.id || '';
          
          for (const [key, value] of Object.entries(CREDIT_PACKAGES)) {
            if (
              priceDescription.toLowerCase().includes(key.toLowerCase()) ||
              priceId.toLowerCase().includes(key.toLowerCase())
            ) {
              creditInfo = value;
              console.log(`✅ Matched credit package "${key}" from price description/ID`);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error retrieving line items:', error);
    }
    
    // If we couldn't determine the package, use the amount to guess
    if (!creditInfo && session.amount_total) {
      const amount = session.amount_total / 100;
      const currency = session.currency?.toLowerCase() || 'usd';
      
      // Get product details if possible - this is now our PRIMARY approach
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
        if (lineItems.data.length > 0) {
          const priceId = lineItems.data[0].price?.id;
          if (priceId) {
            const price = await stripe.prices.retrieve(priceId);
            const product = await stripe.products.retrieve(price.product as string);
            console.log(`Product from line item: ${product.name}`);
            
            // First, try exact product name match from Stripe dashboard
            if (PRODUCT_NAMES[product.name]) {
              creditInfo = PRODUCT_NAMES[product.name];
              console.log(`✅ Exact match for product name: ${product.name} -> ${creditInfo.name}`);
            } else {
              // If no exact match, try partial match with keys like "light", "pro", etc.
              for (const [key, value] of Object.entries(CREDIT_PACKAGES)) {
                if (product.name.toLowerCase().includes(key.toLowerCase()) || 
                    product.name.includes(value.amount.toString())) {
                  creditInfo = value;
                  console.log(`✅ Partial match ${value.name} from product name: ${product.name}`);
                  break;
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error getting product details:', error);
      }
      
      // If we still don't have credit info, try to match based on product ID in metadata
      if (!creditInfo && session.metadata?.productId) {
        try {
          const product = await stripe.products.retrieve(session.metadata.productId);
          
          // First, try exact product name match
          if (PRODUCT_NAMES[product.name]) {
            creditInfo = PRODUCT_NAMES[product.name];
            console.log(`✅ Exact match for metadata product: ${product.name} -> ${creditInfo.name}`);
          } else {
            // If no exact match, try partial match
            for (const [key, value] of Object.entries(CREDIT_PACKAGES)) {
              if (product.name.toLowerCase().includes(key.toLowerCase()) ||
                  product.name.includes(value.amount.toString())) {
                creditInfo = value;
                console.log(`✅ Partial match ${value.name} from metadata product: ${product.name}`);
                break;
              }
            }
          }
        } catch (error) {
          console.error('Error getting product from metadata:', error);
        }
      }
      
      // FALLBACK: If we still don't have credit info, look at amount with currency conversion
      if (!creditInfo) {
        console.log(`FALLBACK: Using price-based matching with amount ${amount} ${currency}`);
        
        // Currency conversion estimates (rough approximations)
        const conversionRates: Record<string, number> = {
          'usd': 1, 
          'eur': 1.08, 
          'gbp': 1.27,
          'czk': 0.044, // CZK to USD conversion rate
          'pln': 0.25,
          'huf': 0.0028
        };
        
        // Convert to USD equivalent for price matching
        const rate = conversionRates[currency] || 1;
        const usdEquivalent = amount * rate;
        console.log(`Converted amount: ${amount} ${currency} ≈ $${usdEquivalent.toFixed(2)} USD`);
        
        // Match based on USD price points
        if (usdEquivalent <= 20) {
          creditInfo = CREDIT_PACKAGES['light'];
          console.log(`✅ Matched Light package based on converted amount: $${usdEquivalent.toFixed(2)}`);
        } else if (usdEquivalent <= 50) {
          creditInfo = CREDIT_PACKAGES['pro']; 
          console.log(`✅ Matched Pro package based on converted amount: $${usdEquivalent.toFixed(2)}`);
        } else {
          creditInfo = CREDIT_PACKAGES['ultra'];
          console.log(`✅ Matched Ultra package based on converted amount: $${usdEquivalent.toFixed(2)}`);
        }
      }
    }
    
    // If we still couldn't determine the package, use a default
    if (!creditInfo) {
      console.log('⚠️ Could not determine credit package, using default of 2000 credits');
      creditInfo = { amount: DEFAULT_CREDITS, name: 'Default Package' };
    }

    // Add credits to the user's account
    await addCreditsToUser(userId, creditInfo.amount, creditInfo.name, session.id);
  } catch (error) {
    console.error('❌ Error handling checkout session completion:', error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Processing payment intent completion:', paymentIntent.id);
    
    // Try to extract user ID from metadata
    const userId = paymentIntent.metadata?.userId;
    
    if (!userId) {
      console.error('No user ID in payment intent metadata');
      
      // Try to find the checkout session that created this payment
      if (paymentIntent.invoice) {
        const invoice = await stripe.invoices.retrieve(paymentIntent.invoice as string);
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          if (subscription.metadata?.userId) {
            console.log('Found user ID in subscription metadata:', subscription.metadata.userId);
            
            // Attempt to find the package from the subscription
            let packageName = 'Default Package';
            let creditAmount = DEFAULT_CREDITS;
            
            for (const item of subscription.items.data) {
              const product = await stripe.products.retrieve(item.price.product as string);
              
              // First try exact product name match
              if (PRODUCT_NAMES[product.name]) {
                creditAmount = PRODUCT_NAMES[product.name].amount;
                packageName = PRODUCT_NAMES[product.name].name;
                console.log(`✅ Exact match for product: ${product.name} -> ${packageName}`);
                break;
              }
              
              // Then try partial match
              for (const [key, value] of Object.entries(CREDIT_PACKAGES)) {
                if (product.name.toLowerCase().includes(key.toLowerCase()) ||
                    product.name.includes(value.amount.toString())) {
                  packageName = value.name;
                  creditAmount = value.amount;
                  console.log(`✅ Partial match ${packageName} from product name: ${product.name}`);
                  break;
                }
              }
            }
            
            await addCreditsToUser(
              subscription.metadata.userId, 
              creditAmount, 
              packageName, 
              paymentIntent.id
            );
            return;
          }
        }
      }
      
      console.error('Could not determine user for payment intent');
      return;
    }
    
    // Extract credit amount from metadata or determine from the product
    let creditAmount = paymentIntent.metadata?.creditAmount 
      ? parseInt(paymentIntent.metadata.creditAmount)
      : null;
      
    let packageName = paymentIntent.metadata?.packageName || 'Credit Purchase';
    
    // If no credit amount in metadata, try to determine from product first
    if (!creditAmount) {
      // Try to find product details if available
      let productName = null;
      
      try {
        // First try to get product info from charges
        const charges = await stripe.charges.list({
          payment_intent: paymentIntent.id,
          limit: 1
        });
        
        if (charges.data.length > 0) {
          const charge = charges.data[0];
          
          // Get product info from charge description (if it contains product name)
          if (charge.description) {
            console.log(`Looking up product from charge description: ${charge.description}`);
            
            // Check for exact product name match
            for (const [name, info] of Object.entries(PRODUCT_NAMES)) {
              if (charge.description.includes(name)) {
                creditAmount = info.amount;
                packageName = info.name;
                console.log(`✅ Exact match for product in charge description: ${name} -> ${packageName}`);
                break;
              }
            }
            
            // If no match found via exact name, try partial match
            if (!creditAmount) {
              for (const [key, value] of Object.entries(CREDIT_PACKAGES)) {
                if (charge.description.toLowerCase().includes(key.toLowerCase()) ||
                    charge.description.includes(value.amount.toString())) {
                  creditAmount = value.amount;
                  packageName = value.name;
                  console.log(`✅ Partial match ${packageName} from charge description: ${charge.description}`);
                  break;
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error getting product details from charges:', error);
      }
      
      // FALLBACK: If we still don't have credit amount, use price-based approach
      if (!creditAmount) {
        const amount = paymentIntent.amount / 100;  // Convert from cents
        const currency = paymentIntent.currency?.toLowerCase() || 'usd';
        
        console.log(`FALLBACK: Using price-based matching with amount ${amount} ${currency}`);
        
        // Currency conversion estimates (rough approximations)
        const conversionRates: Record<string, number> = {
          'usd': 1, 
          'eur': 1.08, 
          'gbp': 1.27,
          'czk': 0.044, // CZK to USD conversion rate
          'pln': 0.25,
          'huf': 0.0028
        };
        
        // Convert to USD equivalent for price matching
        const rate = conversionRates[currency] || 1;
        const usdEquivalent = amount * rate;
        console.log(`Converted amount: ${amount} ${currency} ≈ $${usdEquivalent.toFixed(2)} USD`);
        
        // Simple heuristic to guess the package based on USD equivalent
        if (usdEquivalent <= 20) {
          creditAmount = CREDIT_PACKAGES['light'].amount;
          packageName = CREDIT_PACKAGES['light'].name;
        } else if (usdEquivalent <= 50) {
          creditAmount = CREDIT_PACKAGES['pro'].amount;
          packageName = CREDIT_PACKAGES['pro'].name;
        } else {
          creditAmount = CREDIT_PACKAGES['ultra'].amount;
          packageName = CREDIT_PACKAGES['ultra'].name;
        }
        
        console.log(`Determined package from payment amount $${usdEquivalent.toFixed(2)} USD: ${packageName}, ${creditAmount} credits`);
      }
    }

    // Add credits to the user's account
    await addCreditsToUser(userId, creditAmount, packageName, paymentIntent.id);
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
    throw error;
  }
}

async function handleChargeSucceeded(charge: Stripe.Charge) {
  try {
    console.log('Processing charge:', charge.id);
    
    // Try to get the associated payment intent
    if (charge.payment_intent) {
      const paymentIntent = await stripe.paymentIntents.retrieve(charge.payment_intent as string);
      await handlePaymentIntentSucceeded(paymentIntent);
      return;
    }
    
    // If there's no payment intent, try to use charge metadata
    const userId = charge.metadata?.userId;
    if (!userId) {
      console.error('No user ID found in charge metadata and no associated payment intent');
      return;
    }
    
    let creditAmount = charge.metadata?.creditAmount 
      ? parseInt(charge.metadata.creditAmount)
      : null;
      
    let packageName = charge.metadata?.packageName || 'Credit Purchase';
    
    // If no credit info in metadata, try to determine from product name
    if (!creditAmount) {
      // First try to match from description
      if (charge.description) {
        // Try exact product name match
        for (const [name, info] of Object.entries(PRODUCT_NAMES)) {
          if (charge.description.includes(name)) {
            creditAmount = info.amount;
            packageName = info.name;
            console.log(`✅ Exact match for product in charge description: ${name} -> ${packageName}`);
            break;
          }
        }
        
        // If still no match, try partial match
        if (!creditAmount) {
          for (const [key, value] of Object.entries(CREDIT_PACKAGES)) {
            if (charge.description.toLowerCase().includes(key.toLowerCase()) ||
                charge.description.includes(value.amount.toString())) {
              creditAmount = value.amount;
              packageName = value.name;
              console.log(`✅ Partial match ${packageName} from charge description: ${charge.description}`);
              break;
            }
          }
        }
      }
      
      // FALLBACK: If we still can't determine, use price-based matching
      if (!creditAmount) {
        const amount = charge.amount / 100;  // Convert from cents
        const currency = charge.currency?.toLowerCase() || 'usd';
        
        console.log(`FALLBACK: Using price-based matching with amount ${amount} ${currency}`);
        
        // Currency conversion estimates
        const conversionRates: Record<string, number> = {
          'usd': 1, 
          'eur': 1.08, 
          'gbp': 1.27,
          'czk': 0.044,
          'pln': 0.25,
          'huf': 0.0028
        };
        
        // Convert to USD equivalent for price matching
        const rate = conversionRates[currency] || 1;
        const usdEquivalent = amount * rate;
        console.log(`Converted charge amount: ${amount} ${currency} ≈ $${usdEquivalent.toFixed(2)} USD`);
        
        // Match based on USD price points
        if (usdEquivalent <= 20) {
          creditAmount = CREDIT_PACKAGES['light'].amount;
          packageName = CREDIT_PACKAGES['light'].name;
        } else if (usdEquivalent <= 50) {
          creditAmount = CREDIT_PACKAGES['pro'].amount;
          packageName = CREDIT_PACKAGES['pro'].name;
        } else {
          creditAmount = CREDIT_PACKAGES['ultra'].amount;
          packageName = CREDIT_PACKAGES['ultra'].name;
        }
        
        console.log(`Determined package from charge amount $${usdEquivalent.toFixed(2)} USD: ${packageName}, ${creditAmount} credits`);
      }
    }
    
    await addCreditsToUser(userId, creditAmount || DEFAULT_CREDITS, packageName, charge.id);
  } catch (error) {
    console.error('Error handling charge succeeded:', error);
    throw error;
  }
}

async function addCreditsToUser(userId: string, creditAmount: number, packageName: string, paymentId: string) {
  try {
    console.log(`Adding ${creditAmount} credits to user ${userId} for package "${packageName}"`);
    
    // First get the current credits
    const { data: currentCredits, error: fetchError } = await supabaseAdmin
      .from('user_contact_credits')
      .select('credits_available, credits_used')
      .eq('user_id', userId)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // Record not found
        console.log('No existing credits record, creating new one');
        // Create initial credits record
        const { error: insertError } = await supabaseAdmin
          .from('user_contact_credits')
          .insert({
            user_id: userId,
            credits_available: creditAmount,
            credits_used: 0,
            last_purchase_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('Error creating credits record:', insertError);
          throw insertError;
        }
      } else {
        console.error('Error fetching current credits:', fetchError);
        throw fetchError;
      }
    } else {
      // Update existing credits
      console.log('Current credits:', currentCredits);
      const { error: updateError } = await supabaseAdmin
        .from('user_contact_credits')
        .update({ 
          credits_available: currentCredits.credits_available + creditAmount,
          last_purchase_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('Error updating user credits:', updateError);
        throw updateError;
      }
    }
    
    // Record the purchase regardless
    const { error: purchaseError } = await supabaseAdmin
      .from('credit_purchases')
      .insert({
        user_id: userId,
        package_id: paymentId,
        package_name: packageName,
        credits_amount: creditAmount,
        purchase_date: new Date().toISOString(),
        stripe_payment_intent_id: paymentId
      });
    
    if (purchaseError) {
      console.error('Error recording purchase:', purchaseError);
      throw purchaseError;
    }
    
    console.log(`Successfully added ${creditAmount} credits to user ${userId}`);
  } catch (error) {
    console.error('Error adding credits to user:', error);
    throw error;
  }
} 