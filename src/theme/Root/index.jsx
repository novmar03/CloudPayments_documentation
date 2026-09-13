import React,{useEffect} from 'react';
import {installInteractions} from '../../components/editor-interactions';
export default function Root({children}){useEffect(()=>installInteractions(document),[]);return <>{children}</>;}
