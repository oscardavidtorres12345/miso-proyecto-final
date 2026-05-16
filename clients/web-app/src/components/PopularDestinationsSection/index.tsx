import { useTranslation } from "react-i18next";
import Container from "@/components/Container";
import "./PopularDestinationsSection.css";

interface Destination {
  id: number;
  city: string;
  image: string;
}

const destinations: Destination[] = [
  {
    id: 1,
    city: "Cartagena",
    image: "https://wallpapercave.com/wp/wp3350882.jpg",
  },
  {
    id: 2,
    city: "Medellín",
    image:
      "https://t4.ftcdn.net/jpg/03/57/67/49/360_F_357674904_aEjvlRkZ8ZqJa0vSibQQbNiYUuEPv6MM.jpg",
  },
  {
    id: 3,
    city: "Bogotá",
    image:
      "https://e0.pxfuel.com/wallpapers/588/561/desktop-wallpaper-bogota-bogota-bogota-background-and-bogota-de-noche-bogota.jpg",
  },
  {
    id: 4,
    city: "Santa Marta",
    image:
      "https://e1.pxfuel.com/desktop-wallpaper/562/944/desktop-wallpaper-santa-marta.jpg",
  },
];

const PopularDestinationsSection = () => {
  const { t } = useTranslation();
  return (
    <section className="destinations page-section">
      <Container>
        <p className="section-label">{t("destinations.label")}</p>
        <h2 className="section-heading">{t("destinations.heading")}</h2>
      </Container>
      <Container className="destinations__scroll-wrapper">
        <div className="destinations__cards">
          {destinations.map(({ id, city, image }) => (
            <div key={id} className="destination-card">
              <img src={image} alt={city} className="destination-card__image" />
              <p className="destination-card__city">{city}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default PopularDestinationsSection;
