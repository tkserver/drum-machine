import { DrumMachine } from '@/components/DrumMachine';
import { Helmet } from 'react-helmet-async';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>BEATFORGE - Professional Drum Machine</title>
        <meta 
          name="description" 
          content="Create beats with BEATFORGE, a professional 16-voice drum machine featuring pattern sequencing, arrangement tools, and audio export." 
        />
      </Helmet>
      <DrumMachine />
    </>
  );
};

export default Index;
