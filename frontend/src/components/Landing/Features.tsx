import { Calendar, MapPin, Bell, Heart, MessageCircle, Shield } from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Easy appointment booking with real-time availability. No more scheduling conflicts.',
  },
  {
    icon: MapPin,
    title: 'Location Tracking',
    description: 'Always know where your faculty is on campus. Find them when you need them.',
  },
  {
    icon: Bell,
    title: 'Instant Notifications',
    description: 'Never miss an appointment. Get reminders and updates in real-time.',
  },
  {
    icon: Heart,
    title: 'Follow Faculty',
    description: 'Stay updated with announcements from your favorite faculty members.',
  },
  {
    icon: MessageCircle,
    title: 'Connect & Collaborate',
    description: 'Chat and share resources seamlessly. Build meaningful connections.',
  },
  {
    icon: Shield,
    title: 'Access Management',
    description: 'Complete control over your availability and privacy settings.',
  },
];

const Features = () => {
  return (
    <section className="py-20 sm:py-32 bg-secondary/30" id="features">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything you need to{' '}
            <span className="gradient-text">succeed together</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            ProfConnect provides all the tools students and faculty need for seamless collaboration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-6 sm:p-8 rounded-2xl bg-card border border-border/50 hover-lift cursor-default"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <feature.icon className="h-6 w-6" />
              </div>

              {/* Content */}
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Hover gradient */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
