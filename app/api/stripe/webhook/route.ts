import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/utils/supabase-admin';
import { withCors } from '@/utils/cors';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper function for consistent logging
function logWebhookEvent(message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] WEBHOOK: ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// Credit packages - matches the new system
const CREDIT_PACKAGES: {[key: string]: {amount: number, name: string}} = {
  'light': { amount: 2000, name: 'Light Package' },
  'pro': { amount: 6000, name: 'Pro Package' },
  'ultra': { amount: 20000, name: 'Ultra Package' }
};

// These product names should exactly match what's in your Stripe dashboard
const PRODUCT_NAMES: {[key: string]: {amount: number, name: string}} = {
  '2000 Contacts': CREDIT_PACKAGES['light'],
  '6000 Contacts': CREDIT_PACKAGES['pro'],
  '20000 Contacts': CREDIT_PACKAGES['ultra'],
};

// Default fallback for testing
const DEFAULT_CREDITS = 2000;

// Need to disable body parsing for Stripe webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};

export const POST = withCors(async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  try {
    logWebhookEvent('Received webhook request');
    logWebhookEvent('Stripe signature', sig);

    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    logWebhookEvent(`Event received: ${event.type}`, event.data.object);

    // MIGRATION: Forward to the new webhook handler
    try {
      // Create a new request to forward to the new webhook handler
      const forwardResponse = await fetch(`${request.nextUrl.origin}/api/webhook/stripe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': sig
        },
        body: body
      });
      
      if (forwardResponse.ok) {
        logWebhookEvent('Successfully forwarded to new webhook handler');
        return NextResponse.json({ received: true, forwarded: true });
      } else {
        // If forward fails, try to handle it directly with credits instead of subscriptions
        const errorText = await forwardResponse.text();
        logWebhookEvent(`Forward failed with status ${forwardResponse.status}: ${errorText}`);
        logWebhookEvent('Handling directly with credits system');
        
        if (event.type === 'checkout.session.completed') {
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutWithCredits(session);
        } else if (event.type === 'payment_intent.succeeded') {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await handlePaymentWithCredits(paymentIntent);
        } else if (event.type === 'charge.succeeded') {
          const charge = event.data.object as Stripe.Charge;
          await handleChargeWithCredits(charge);
        }
      }
    } catch (forwErr) {
      logWebhookEvent('Error forwarding webhook', forwErr);
      // Continue with old handler as fallback
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    logWebhookEvent('Webhook error', err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
});

// Handle checkout session with credits instead of subscription
async function handleCheckoutWithCredits(session: Stripe.Checkout.Session) {
  if (!session.client_reference_id) {
    logWebhookEvent('Missing client_reference_id (user ID)');
    return;
  }
  
  const userId = session.client_reference_id;
  
  // Try to determine package from line items first
  let creditInfo = null;
  
  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
    if (lineItems.data.length > 0) {
      logWebhookEvent('Session line items count:', lineItems.data.length);
      logWebhookEvent('First line item:', lineItems.data[0]);
      
      if (lineItems.data[0].price?.product) {
        const productId = lineItems.data[0].price.product as string;
        const product = await stripe.products.retrieve(productId);
        logWebhookEvent('Product details:', { id: product.id, name: product.name });
        
        // First try exact product name match
        if (PRODUCT_NAMES[product.name]) {
          creditInfo = PRODUCT_NAMES[product.name];
          logWebhookEvent(`✅ Exact match for product: ${product.name} -> ${creditInfo.name}`);
        } else {
          // If no exact match, try partial match
          for (const [key, value] of Object.entries(CREDIT_PACKAGES)) {
            if (product.name.toLowerCase().includes(key.toLowerCase()) || 
                product.name.includes(value.amount.toString())) {
              creditInfo = value;
              logWebhookEvent(`✅ Partial match ${value.name} from product name: ${product.name}`);
              break;
            }
          }
        }
      }
    }
  } catch (error) {
    logWebhookEvent('Error getting line items or product:', error);
  }
  
  // FALLBACK: If we couldn't determine package from line items, use amount with currency conversion
  if (!creditInfo && session.amount_total) {
    const amount = session.amount_total / 100;
    const currency = session.currency?.toLowerCase() || 'usd';
    
    logWebhookEvent(`FALLBACK: Using price-based matching with amount ${amount} ${currency}`);
    
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
    logWebhookEvent(`Converted amount: ${amount} ${currency} ≈ $${usdEquivalent.toFixed(2)} USD`);
    
    // Match based on USD price points
    if (usdEquivalent <= 20) {
      creditInfo = CREDIT_PACKAGES['light'];
      logWebhookEvent(`Matched Light package based on converted amount: $${usdEquivalent.toFixed(2)}`);
    } else if (usdEquivalent <= 50) {
      creditInfo = CREDIT_PACKAGES['pro']; 
      logWebhookEvent(`Matched Pro package based on converted amount: $${usdEquivalent.toFixed(2)}`);
    } else {
      creditInfo = CREDIT_PACKAGES['ultra'];
      logWebhookEvent(`Matched Ultra package based on converted amount: $${usdEquivalent.toFixed(2)}`);
    }
  }
  
  // If we still couldn't determine the package, use a default
  if (!creditInfo) {
    logWebhookEvent('Could not determine credit package, using default of 2000 credits');
    creditInfo = { amount: DEFAULT_CREDITS, name: 'Default Package' };
  }
  
  logWebhookEvent(`Adding ${creditInfo.amount} credits for user ${userId} for package "${creditInfo.name}"`);
  
  await addCreditsToUser(userId, creditInfo.amount, creditInfo.name, session.id);
}

// Handle payment intent with credits
async function handlePaymentWithCredits(paymentIntent: Stripe.PaymentIntent) {
  // Try to get client reference from checkout session
  if (paymentIntent.metadata?.userId) {
    const userId = paymentIntent.metadata.userId;
    
    // Try to get credit amount from metadata
    let creditAmount = paymentIntent.metadata?.creditAmount 
      ? parseInt(paymentIntent.metadata.creditAmount)
      : null;
    let packageName = paymentIntent.metadata?.packageName || 'Credit Purchase';
    
    // If no credit amount in metadata, try to determine from charge/product info
    if (!creditAmount) {
      try {
        // Try to get charge associated with this payment
        const charges = await stripe.charges.list({
          payment_intent: paymentIntent.id,
          limit: 1
        });
        
        if (charges.data.length > 0) {
          const charge = charges.data[0];
          
          // Look for product info in charge description
          if (charge.description) {
            // Try exact product name match
            for (const [name, info] of Object.entries(PRODUCT_NAMES)) {
              if (charge.description.includes(name)) {
                creditAmount = info.amount;
                packageName = info.name;
                logWebhookEvent(`✅ Exact match for product in charge description: ${name} -> ${packageName}`);
                break;
              }
            }
            
            // If no exact match, try partial match
            if (!creditAmount) {
              for (const [key, value] of Object.entries(CREDIT_PACKAGES)) {
                if (charge.description.toLowerCase().includes(key.toLowerCase()) ||
                    charge.description.includes(value.amount.toString())) {
                  creditAmount = value.amount;
                  packageName = value.name;
                  logWebhookEvent(`✅ Partial match from charge description: ${charge.description}`);
                  break;
                }
              }
            }
          }
        }
      } catch (error) {
        logWebhookEvent('Error getting charges:', error);
      }
      
      // FALLBACK: If still no credit amount, use amount with currency conversion
      if (!creditAmount) {
        const amount = paymentIntent.amount / 100;
        const currency = paymentIntent.currency?.toLowerCase() || 'usd';
        
        logWebhookEvent(`FALLBACK: Using price-based matching with amount ${amount} ${currency}`);
        
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
        logWebhookEvent(`Converted payment amount: ${amount} ${currency} ≈ $${usdEquivalent.toFixed(2)} USD`);
        
        // Match based on USD price points
        if (usdEquivalent <= 20) {
          creditAmount = CREDIT_PACKAGES['light'].amount;
          packageName = CREDIT_PACKAGES['light'].name;
          logWebhookEvent(`Matched Light package based on converted amount: $${usdEquivalent.toFixed(2)}`);
        } else if (usdEquivalent <= 50) {
          creditAmount = CREDIT_PACKAGES['pro'].amount;
          packageName = CREDIT_PACKAGES['pro'].name;
          logWebhookEvent(`Matched Pro package based on converted amount: $${usdEquivalent.toFixed(2)}`);
        } else {
          creditAmount = CREDIT_PACKAGES['ultra'].amount;
          packageName = CREDIT_PACKAGES['ultra'].name;
          logWebhookEvent(`Matched Ultra package based on converted amount: $${usdEquivalent.toFixed(2)}`);
        }
      }
    }
    
    await addCreditsToUser(userId, creditAmount || DEFAULT_CREDITS, packageName, paymentIntent.id);
  } else {
    logWebhookEvent('No user ID in payment intent metadata, attempting to find from payment');
    
    // Try to get associated checkout session
    try {
      const charges = await stripe.charges.list({
        payment_intent: paymentIntent.id
      });
      
      if (charges.data.length > 0) {
        const charge = charges.data[0];
        await handleChargeWithCredits(charge);
      }
    } catch (error) {
      logWebhookEvent('Error finding checkout session', error);
    }
  }
}

// Handle charge with credits
async function handleChargeWithCredits(charge: Stripe.Charge) {
  if (charge.payment_intent) {
    const paymentIntent = await stripe.paymentIntents.retrieve(charge.payment_intent as string);
    
    if (paymentIntent.metadata?.userId) {
      await handlePaymentWithCredits(paymentIntent);
      return;
    }
    
    // Try to find checkout session that created this payment
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: paymentIntent.id,
      limit: 1
    });
    
    if (sessions.data.length > 0) {
      const session = sessions.data[0];
      
      if (session.client_reference_id) {
        const userId = session.client_reference_id;
        
        // Try to determine package from metadata or charge description
        let creditInfo = null;
        
        if (charge.description) {
          // Try exact product name match
          for (const [name, info] of Object.entries(PRODUCT_NAMES)) {
            if (charge.description.includes(name)) {
              creditInfo = info;
              logWebhookEvent(`✅ Exact match for product in charge description: ${name} -> ${info.name}`);
              break;
            }
          }
          
          // If no exact match, try partial match
          if (!creditInfo) {
            for (const [key, value] of Object.entries(CREDIT_PACKAGES)) {
              if (charge.description.toLowerCase().includes(key.toLowerCase()) || 
                  charge.description.includes(value.amount.toString())) {
                creditInfo = value;
                logWebhookEvent(`✅ Partial match ${value.name} from charge description: ${charge.description}`);
                break;
              }
            }
          }
        }
        
        // FALLBACK: If we couldn't determine from description, use amount with currency conversion
        if (!creditInfo) {
          const amount = charge.amount / 100;
          const currency = charge.currency?.toLowerCase() || 'usd';
          
          logWebhookEvent(`FALLBACK: Using price-based matching with amount ${amount} ${currency}`);
          
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
          logWebhookEvent(`Converted charge amount: ${amount} ${currency} ≈ $${usdEquivalent.toFixed(2)} USD`);
          
          // Match based on USD price points
          if (usdEquivalent <= 20) {
            creditInfo = CREDIT_PACKAGES['light'];
            logWebhookEvent(`Matched Light package based on converted amount: $${usdEquivalent.toFixed(2)}`);
          } else if (usdEquivalent <= 50) {
            creditInfo = CREDIT_PACKAGES['pro'];
            logWebhookEvent(`Matched Pro package based on converted amount: $${usdEquivalent.toFixed(2)}`);
          } else {
            creditInfo = CREDIT_PACKAGES['ultra'];
            logWebhookEvent(`Matched Ultra package based on converted amount: $${usdEquivalent.toFixed(2)}`);
          }
        }
        
        // If we still couldn't determine, use default
        if (!creditInfo) {
          logWebhookEvent('Could not determine credit package, using default of 2000 credits');
          creditInfo = { amount: DEFAULT_CREDITS, name: 'Default Package' };
        }
        
        await addCreditsToUser(userId, creditInfo.amount, creditInfo.name, charge.id);
      }
    }
  }
}

// Add credits to a user
async function addCreditsToUser(userId: string, creditAmount: number, packageName: string, paymentId: string) {
  try {
    logWebhookEvent(`Adding ${creditAmount} credits to user ${userId} for package "${packageName}"`);
    
    // First get the current credits
    const { data: currentCredits, error: fetchError } = await supabaseAdmin
      .from('user_contact_credits')
      .select('credits_available, credits_used')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // Record not found
        logWebhookEvent('No existing credits record, creating new one');
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
          logWebhookEvent('Error creating credits record:', insertError);
          throw insertError;
        }
      } else {
        logWebhookEvent('Error fetching current credits:', fetchError);
        throw fetchError;
      }
    } else {
      // Update existing credits
      logWebhookEvent('Current credits:', currentCredits);
      const { error: updateError } = await supabaseAdmin
        .from('user_contact_credits')
        .update({
          credits_available: currentCredits.credits_available + creditAmount,
          last_purchase_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        logWebhookEvent('Error updating user credits:', updateError);
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
      logWebhookEvent('Error recording purchase:', purchaseError);
      throw purchaseError;
    }
    
    logWebhookEvent(`Successfully added ${creditAmount} credits to user ${userId}`);
  } catch (error) {
    logWebhookEvent('Error adding credits to user:', error);
    throw error;
  }
} 