import React, { FC, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { ChakraProvider, Flex, Link } from '@chakra-ui/react'

import { getMessage } from '../utils/api';
import { isAuthenticated } from '../utils/auth';

const useStyles = makeStyles((theme) => ({
  link: {
    color: '#61dafb',
  },
}));

export const Home: FC = () => {
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const classes = useStyles();

  const queryBackend = async () => {
    try {
      const message = await getMessage();
      setMessage(message);
    } catch (err) {
      setError(err);
    }
  };

  return (
    <>
      <Flex height="40em" justifyContent="center" alignItems="center">
      {/*{!message && !error && (*/}
      {/*  <a className={classes.link} href="#" onClick={() => queryBackend()}>*/}
      {/*    Click to make request to Backend*/}
      {/*  </a>*/}
      {/*)}*/}
      {/*{message && (*/}
      {/*  <p>*/}
      {/*    <code>{message}</code>*/}
      {/*  </p>*/}
      {/*)}*/}
      {/*{error && (*/}
      {/*  <p>*/}
      {/*    Error: <code>{error}</code>*/}
      {/*  </p>*/}
      {/*)}*/}
      <Link href="/game" border="2px" borderRadius="2em">
        Enter the ChronoFootball
      </Link>
      {/*<a className={classes.link} href="/admin">*/}
      {/*  Admin Dashboard*/}
      {/*</a>*/}
      {/*<a className={classes.link} href="/protected">*/}
      {/*  Protected Route*/}
      {/*</a>*/}
      {/*{isAuthenticated() ? (*/}
      {/*  <a className={classes.link} href="/logout">*/}
      {/*    Logout*/}
      {/*  </a>*/}
      {/*) : (*/}
      {/*  <>*/}
      {/*    <a className={classes.link} href="/login">*/}
      {/*      Login*/}
      {/*    </a>*/}
      {/*    <a className={classes.link} href="/signup">*/}
      {/*      Sign Up*/}
      {/*    </a>*/}
      {/*  </>*/}
      {/*)}*/}
      </Flex>
    </>
  );
};
