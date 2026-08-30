import { RevealGroup } from "@/components/common/tsx/RevealGroup";
import { ContactCard } from "@/components/contact/ContactCard";

interface ContactLink {
  url: string;
  name: string;
  icon: string;
  hoverColor: string;
}

/**
 * Wraps the contact links in a single island so they share one stagger and one
 * in-view observer. Previously each card was its own `client:load` island with
 * its own observer and its own animation.
 */
export function ContactCardList({ contacts }: { contacts: ContactLink[] }) {
  return (
    <RevealGroup className="space-y-2" preset="slide">
      {contacts.map((contact) => (
        <ContactCard key={contact.name} contact={contact} />
      ))}
    </RevealGroup>
  );
}
