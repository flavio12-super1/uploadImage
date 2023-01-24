import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

function Home() {
  const [file, setFile] = useState();
  const [images, setImages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("/api/posts").then((res) => {
      console.log(res.data);
      setImages(res.data);
    });
  }, []);

  const submit = async (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("image", file);
    await axios
      .post("/api/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        console.log(res.data);
        setImages((image) => [...image, res.data]);
      });

    navigate("/");
  };

  const fileSelected = (event) => {
    const file = event.target.files[0];
    setFile(file);
  };

  // render images from array
  const renderImages = () => {
    return images.map((imgURL, index) => (
      <div key={index} className="imageDiv">
        <img src={imgURL.imgURL} className="myImage" alt="" />
      </div>
    ));
  };

  return (
    <div>
      <form onSubmit={submit} style={{ width: 650 }}>
        <input onChange={fileSelected} type="file" accept="image/*"></input>
        <button type="submit">Submit</button>
      </form>

      <div id="imageWrapper">{renderImages().reverse()}</div>
    </div>
  );
}

export default Home;
