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
    // A stack of three on PC; one row of three on a phone, where the stack
    // cost the section ~130px it does not have (see .contact-cards).
    <RevealGroup className="contact-cards" preset="slide">
      {contacts.map((contact) => (
        <ContactCard key={contact.name} contact={contact} />
      ))}
    </RevealGroup>
  );
}
