import React, { useEffect, useState } from 'react'
import './index.css'
import { FaEye, FaEyeSlash, FaEdit, FaTrash } from 'react-icons/fa'
import Modal from 'react-modal'

const MyCredentials = () => {
  const [credentials, setCredentials] = useState([])
  const [editModalIsOpen, setEditModalIsOpen] = useState(false)
  const [selectedCredential, setSelectedCredential] = useState(null)
  const [editedCredential, setEditedCredential] = useState({})
  const [generatedPassword, setGeneratedPassword] = useState('')

  const getMyCredentials = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_DOMAIN_API}/my-credentials`,
        {
          method: 'GET'
        }
      )

      if (response.ok) {
        const { myCredentials } = await response.json()
        myCredentials.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        )

        setCredentials(
          myCredentials.map((cred) => ({ ...cred, showPassword: false }))
        )
      } else {
        const responseParsed = await response.json()
        alert(responseParsed.displayMessage)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    getMyCredentials()
  }, [])

  const togglePassword = (index) => {
    const updatedCredentials = [...credentials]
    updatedCredentials[index].showPassword =
      !updatedCredentials[index].showPassword
    setCredentials(updatedCredentials)
  }

  const openEditModal = (credential) => {
    setSelectedCredential(credential ?? {})
    setEditedCredential({ ...credential } ?? {})
    setEditModalIsOpen(true)
  }

  const closeEditModal = () => {
    setEditModalIsOpen(false)
    setSelectedCredential(null)
    setEditedCredential({})
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditedCredential({ ...editedCredential, [name]: value })
  }

  const handleSaveEditedCredential = async (event) => {
    event.preventDefault()
    try {
      const response = await fetch(
        `${process.env.REACT_APP_DOMAIN_API}/password`,
        {
          method: editedCredential._id ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(editedCredential)
        }
      )

      if (response.ok) {
        // Atualização bem-sucedida
        closeEditModal()
        getMyCredentials() // Requisita os dados atualizados
        setGeneratedPassword('')
      } else {
        const responseParsed = await response.json()
        alert(responseParsed.displayMessage)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      'Tem certeza que deseja excluir este item?'
    )
    if (!confirmDelete) return
    try {
      // Aqui você fará a chamada DELETE para excluir a senha
      const response = await fetch(
        `${process.env.REACT_APP_DOMAIN_API}/password/${id}`,
        {
          method: 'DELETE'
        }
      )

      if (response.ok) {
        getMyCredentials()
      } else {
        const responseParsed = await response.json()
        alert(responseParsed.displayMessage)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleGeneratePassword = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_DOMAIN_API}/generate-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            length: 15,
            numbers: true,
            symbols: true,
            uppercase: true,
            lowercase: true
          })
        }
      )

      if (response.ok) {
        const { password } = await response.json()
        setGeneratedPassword(password) // Atualiza o estado com a senha gerada
        setEditedCredential({ ...editedCredential, password })
      } else {
        const responseParsed = await response.json()
        alert(responseParsed.displayMessage)
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div>
      <h1 className="header-title">Secrets Manager</h1>
      <table>
        <thead>
          <tr>
            <th>Título</th>
            <th>Senha</th>
            <th>Domínio</th>
            <th>Criado</th>
            <th>Atualizado</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {credentials.map((credential, index) => (
            <tr key={credential._id}>
              <td>{credential.title}</td>
              <td>
                <input
                  type={credential.showPassword ? 'text' : 'password'}
                  value={
                    credential.showPassword ? credential.password : '********'
                  }
                  readOnly
                  className="my-credentials-input"
                ></input>
                {!credential.showPassword ? (
                  <FaEyeSlash
                    onClick={() => togglePassword(index)}
                    style={{ marginLeft: '5%', cursor: 'pointer' }}
                  />
                ) : (
                  <FaEye
                    onClick={() => togglePassword(index)}
                    style={{ marginLeft: '5%', cursor: 'pointer' }}
                  />
                )}
              </td>
              <td>{credential.site}</td>
              <td>{formatDateTime(credential.createdAt)}</td>
              <td>{formatDateTime(credential.updatedAt)}</td>
              <td>
                <FaEdit
                  onClick={() => openEditModal(credential)}
                  style={{ cursor: 'pointer' }}
                />
              </td>
              <td>
                <FaTrash
                  onClick={() => handleDelete(credential._id)}
                  style={{ cursor: 'pointer' }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bottom-buttons">
        <button onClick={() => openEditModal()}>
          Adicionar Nova Credencial
        </button>
      </div>
      <Modal
        isOpen={editModalIsOpen}
        onRequestClose={closeEditModal}
        contentLabel="Edit Credential Modal"
        className="edit-modal"
      >
        <h2>Editar Credencial</h2>
        <form onSubmit={handleSaveEditedCredential}>
          <label>
            Título:
            <input
              type="text"
              name="title"
              value={editedCredential.title || ''}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Senha:
            <input
              type="password"
              name="password"
              value={editedCredential.password || generatedPassword}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Site:
            <input
              type="text"
              name="site"
              value={editedCredential.site || ''}
              onChange={handleInputChange}
            />
          </label>
          <button type="button" onClick={handleGeneratePassword}>
            Gerar Senha
          </button>
          <button type="submit">Save</button>
        </form>
      </Modal>
    </div>
  )
}

const formatDateTime = (dateTime) => {
  const date = new Date(dateTime)
  return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString()
}

export default MyCredentials
