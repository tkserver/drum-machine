import { DrumMachine } from '@/components/DrumMachine';
import { Helmet } from 'react-helmet-async';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>DRUM MACHINE - Professional Drum Machine</title>
        <meta 
          name="description" 
          content="Create beats with DRUM MACHINE, a professional 16-voice drum machine featuring pattern sequencing, arrangement tools, and audio export." 
        />
      </Helmet>
      <DrumMachine />
    </>
  );
};

export default Index;
