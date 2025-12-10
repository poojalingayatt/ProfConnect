import { Search, CalendarCheck, Users } from 'lucide-react';

const steps = [
  {
    icon: Search,
    step: '01',
    title: 'Search Faculty',
    description: 'Browse through faculty profiles and check their availability in real-time.',
  },
  {
    icon: CalendarCheck,
    step: '02',
    title: 'Book Appointment',
    description: 'Select a convenient time slot and confirm your appointment instantly.',
  },
  {
    icon: Users,
    step: '03',
    title: 'Get Connected',
    description: 'Meet with your faculty and get the guidance you need to succeed.',
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 sm:py-32" id="how-it-works">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            How it <span className="gradient-text">works</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Get started in three simple steps and connect with faculty today.
          </p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((item, index) => (
              <div key={index} className="relative text-center">
                {/* Step number */}
                <div className="relative z-10 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-card border-2 border-primary/20 mb-6 group hover:border-primary transition-colors duration-300">
                  <item.icon className="h-8 w-8 text-primary" />
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                </div>

                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
