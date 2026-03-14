import Image from "astro/components/Image.astro";

type ContactCardType = {
  url: string,
  name: string,
  icon: string
};

const ContactCardComponent = (data:ContactCardType) => {
  return (
    <a href={data.url} className="grid grid-cols-2 justify-center gap-8 bg-slate-700">
      <Image class="aspect-square rounded-[50%] object-cover" loading={'eager'} width={100} height={100} src={data.icon} alt={data.name}/>
      <h3>{data.name}</h3>
    </a>
  );
};

export default ContactCardComponent;
