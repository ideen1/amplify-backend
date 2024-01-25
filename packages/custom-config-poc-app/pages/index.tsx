import Head from "next/head";
import Image from "next/image";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { useState, useEffect } from 'react'
import config from '../amplifyconfiguration.json';
import { getCurrentUser } from 'aws-amplify/auth';
import { MapView, LocationSearch } from '@aws-amplify/ui-react-geo';
import '@aws-amplify/ui-react-geo/styles.css';

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [data, setData] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    fetch(config.custom.myApiUrl, {
      headers: {
       'x-api-key' : config.custom.myApiKey
      }
    })
      .then((res) => res.text())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    getCurrentUser().then(user => {
      setUserId(user.userId);
    })
  }, [])

  if (isLoading)   return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${styles.main} ${inter.className}`}>
        <div className={styles.description}>
          <p>Hello, Amplify 👋</p>
          <p>Hello {userId}</p>
          <p>Loading...</p>
        </div>
      </main>
    </>
  );

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${styles.main} ${inter.className}`}>
        <div className={styles.description}>
          <p>Hello, Amplify 👋</p>
          <p>Hello {userId}</p>
          <p>{data}</p>
        </div>
        <div>
          <MapView initialViewState={{
            latitude: 47.61539971119491,
            longitude: -122.3348765399794,
            zoom: 14,
          }}>
            <LocationSearch position="top-left" />
          </MapView>
        </div>
      </main>
    </>
  );
}
