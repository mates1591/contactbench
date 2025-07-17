import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    content: "The B2B Database Builder revolutionized our outreach efforts. We generated a list of 500 highly targeted contacts and achieved a 28% response rate on our first campaign.",
    author: "Sarah Johnson",
    title: "Marketing Director",
    company: "TechGrowth Solutions",
    rating: 5
  },
  {
    content: "I'm impressed by the accuracy of the contact data. Previously, we were dealing with bounce rates of over 20%. With this tool, our bounce rate dropped to just 3%.",
    author: "Michael Chen",
    title: "Sales Manager",
    company: "Innovex Inc.",
    rating: 5
  },
  {
    content: "The ability to filter by specific technologies used by companies has been a game-changer for our sales team. We can now target prospects with pinpoint accuracy.",
    author: "Jessica Williams",
    title: "VP of Business Development",
    company: "SaaS Ventures",
    rating: 5
  },
  {
    content: "We've tried several lead generation tools before, but this one stands out for its data quality and ease of use. Well worth the investment for any B2B sales organization.",
    author: "David Martinez",
    title: "CEO",
    company: "GrowthForce Agency",
    rating: 4
  },
  {
    content: "The export options make it seamless to integrate with our existing CRM. We're saving hours each week on manual data entry and enrichment.",
    author: "Emily Rodriguez",
    title: "Sales Operations Manager",
    company: "Enterprise Solutions Group",
    rating: 5
  },
  {
    content: "The customer service is exceptional. When we had questions about targeting specific industries, the team provided personalized assistance that exceeded our expectations.",
    author: "Robert Thompson",
    title: "Head of Demand Generation",
    company: "MarketPro Services",
    rating: 5
  }
];

export function TestimonialSection() {
  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white">
            What Our <span className="gradient-text">Customers</span> Say
          </h2>
          <p className="mt-4 text-lg secondary-text max-w-3xl mx-auto">
            Don't just take our word for it. See how B2B Database Builder 
            has helped companies accelerate their lead generation and sales efforts.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="testimonial-card bg-neutral-dark border border-gray-800 p-6 rounded-xl shadow-md"
            >
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={`${
                      i < testimonial.rating 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
              
              <blockquote className="secondary-text mb-6">
                "{testimonial.content}"
              </blockquote>
              
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-medium">
                  {testimonial.author.charAt(0)}
                </div>
                <div className="ml-3">
                  <div className="font-medium text-white">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-gray-400">
                    {testimonial.title}, {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 