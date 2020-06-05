import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import './styles.css';
import api from '../../services/api';
import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet';
import Dropzone from '../../components/Dropzone';
import logo from '../../images/logo.svg';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';

interface Item {
  id: number;
  title: string;
  image_url: string;
}

interface UF_IBGE {
  sigla: string;
}
interface City_IBGE {
  nome: string;
}

const CreatePoint = () => {
  const [items, setItems] = useState<Item[]>([]);

  const [ufs, setUfs] = useState<string[]>([]);

  const [cities, setCities] = useState<string[]>([]);

  const [selectedUF, setSelectedUF] = useState('0');

  const [selectedCity, setSelectedCity] = useState('0');

  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([
    0,
    0,
  ]);
  const [selectedItem, setSelectedItem] = useState<number[]>([]);

  const [initialPosition, setInitialPosition] = useState<[number, number]>([
    0,
    0,
  ]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    zap: '',
  });

  const [selectedFile, setSelectedFile] = useState<File>();

  const history = useHistory();

  useEffect(() => {
    api.get('items').then((res) => {
      setItems(res.data);
    });
  }, []);

  useEffect(() => {
    axios
      .get<UF_IBGE[]>(
        'https://servicodados.ibge.gov.br/api/v1/localidades/estados'
      )
      .then((res) => {
        const ufInitials = res.data.map((uf) => uf.sigla);
        setUfs(ufInitials);
      });
  }, []);

  useEffect(() => {
    if (selectedUF === '0') {
      return;
    }

    axios
      .get<City_IBGE[]>(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/municipios`
      )
      .then((res) => {
        const cityNames = res.data.map((city) => city.nome);
        setCities(cityNames);
      });
  }, [selectedUF]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      setInitialPosition([latitude, longitude]);
    });
  }, []);

  function handleSelectedUF(event: ChangeEvent<HTMLSelectElement>) {
    const uf = event.target.value;
    setSelectedUF(uf);
  }

  function handleSelectedCity(event: ChangeEvent<HTMLSelectElement>) {
    const city = event.target.value;
    setSelectedCity(city);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  }

  function handleMapClick(event: LeafletMouseEvent) {
    setSelectedPosition([event.latlng.lat, event.latlng.lng]);
  }

  function handleSelectedItem(id: number) {
    if (selectedItem.includes(id)) {
      const filteredItem = selectedItem.filter((item) => {
        return item !== id;
      });
      setSelectedItem(filteredItem);
    } else {
      setSelectedItem([...selectedItem, id]);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const { name, email, zap } = formData;
    const uf = selectedUF;
    const city = selectedCity;
    const [latitude, longitude] = selectedPosition;
    const item = selectedItem;

    const data = new FormData();

    data.append('name', name);
    data.append('email', email);
    data.append('whatsapp', zap);
    data.append('uf', uf);
    data.append('city', city);
    data.append('latitude', String(latitude));
    data.append('longitude', String(longitude));
    data.append('items', item.join(','));
    if (selectedFile) {
      data.append('image', selectedFile);
    }

    await api.post('points', data);

    alert('Ponto de coleta criado');

    history.push('/');
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta Logo" />

        <Link to="/">
          <FiArrowLeft />
          Voltar para home
        </Link>
      </header>
      <form onSubmit={handleSubmit}>
        <h1>
          Cadastro do <br />
          ponto de coleta
        </h1>

        <Dropzone onFileUploaded={setSelectedFile} />

        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>

          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input
              type="text"
              name="name"
              id="name"
              onChange={handleInputChange}
            ></input>
          </div>
          <div className="field-group">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                name="email"
                id="email"
                onChange={handleInputChange}
              ></input>
            </div>
            <div className="field">
              <label htmlFor="zap">Whatsapp</label>
              <input
                type="text"
                name="zap"
                id="zap"
                onChange={handleInputChange}
              ></input>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>

          <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={selectedPosition} />
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>
              <select
                name="uf"
                id="uf"
                value={selectedUF}
                onChange={handleSelectedUF}
              >
                <option value="0">Selecione uma UF</option>
                {ufs.map((uf) => {
                  return (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select
                name="city"
                id="city"
                value={selectedCity}
                onChange={handleSelectedCity}
              >
                <option value="0">Selecione uma cidade</option>
                {cities.map((city) => {
                  return (
                    <option value={city} key={city}>
                      {city}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Itens de coleta</h2>
            <span>Selecione um ou mais itens abaixo</span>
          </legend>
          <ul className="items-grid">
            {items.map((item) => {
              return (
                <li
                  key={item.id}
                  onClick={() => handleSelectedItem(item.id)}
                  className={selectedItem.includes(item.id) ? 'selected' : ''}
                >
                  <img src={item.image_url} alt="Imagem opção" />
                  <span>{item.title}</span>
                </li>
              );
            })}
          </ul>
        </fieldset>
        <button type="submit">Cadastrar ponto de coleta</button>
      </form>
    </div>
  );
};

export default CreatePoint;
