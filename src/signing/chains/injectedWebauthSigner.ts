import { Signer } from "..";
import { SignatureConfig, SIG_CONFIG } from "../../constants";
import Arweave from "arweave";
import base64url from "base64url";

export default class InjectedWebauthSigner implements Signer {
  private signer: any;
  public publicKey: Buffer;
  readonly ownerLength: number = SIG_CONFIG[SignatureConfig.WEBAUTH].pubLength;
  readonly signatureLength: number =
    SIG_CONFIG[SignatureConfig.WEBAUTH].sigLength;
  readonly signatureType: SignatureConfig = SignatureConfig.WEBAUTH;

  // 传递 Everpay 实例，以及 publicKey
  constructor({ everpay, publicKey, account, debug }: any) {
    const sign = {
      everpay,
      account,
      debug,
      getActivePublicKey: function (): any {
        return publicKey;
      },
    };
    this.signer = sign;
  }

  // 设置 PublicKey
  async setPublicKey(): Promise<void> {
    // try {
    //   await checkArPermissions(this.signer, ["ACCESS_PUBLIC_KEY"])
    // } catch {
    //   throw new Error("ACCESS_PUBLIC_KEY_PERMISSION_NEEDED")
    // }
    const fidoOwner = await this.signer.getActivePublicKey();
    console.log(fidoOwner, "fidoOwner");
    // Decode the base64 URL string
    const decodedString = base64url.decode(fidoOwner as string);

    // Check the length of the decoded string
    const decodedByteLength = (decodedString as any).byteLength;

    // Create a new buffer with a length of 1024 bytes
    const paddedBuffer = Buffer.alloc(1024);

    // Copy the decoded string to the padded buffer
    Buffer.from(decodedString).copy(paddedBuffer);

    // If the decoded byte length is less than 1024, fill the remaining space with zeroes
    if (decodedByteLength < 1024) {
      paddedBuffer.fill(0, decodedByteLength);
    }

    // Log the byte length of the padded buffer
    console.log(paddedBuffer.byteLength);
    console.log(
      base64url.encode(paddedBuffer),
      "base64url.encode(paddedBuffer)",
    );
    this.publicKey = paddedBuffer;
  }

  // 签名数据
  async sign(message: Uint8Array): Promise<Uint8Array> {
    console.log(message, "message");
    if (!this.publicKey) {
      await this.setPublicKey();
    }
    console.log(123123123);
    try {
      const decoder = new TextDecoder("utf-8");
      const { sig, everHash } = await this.signer.everpay.signMessageAsync(
        {
          isSmartAccount: true,
          debug: this.signer.debug,
          account: this.signer.account,
        },
        decoder.decode(message),
      );
      console.log(sig, "sig");
      console.log(everHash, "everHash");
      // message.set(sig)
      console.log(Buffer.from([sig.slice(",")[0], everHash].join(",")), "Buffer.from([sig.slice(",")[0], everHash].join(","));")
      // 观察 arweave 和 ethereum 签名对 message 进行了什么操作。
      return Buffer.from([sig.slice(",")[0], everHash].join(","));
    } catch {
      throw new Error("SIGNATURE_FAILED");
    }

    // try {
    //   await checkArPermissions(this.signer, "SIGNATURE")
    // } catch {
    //   throw new Error("SIGNATURE_PERMISSION_NEEDED")
    // }

    // const algorithm = {
    //   name: "RSA-PSS",
    //   saltLength: 0
    // }

    // try {
    //   const signature = await this.signer.signature(
    //     message,
    //     algorithm
    //   )
    //   const buf = new Uint8Array(Object.values(signature))
    //   return buf
    // } catch {
    //   throw new Error("SIGNATURE_FAILED")
    // }
  }

  static async verify(
    pk: string,
    message: Uint8Array,
    signature: Uint8Array,
  ): Promise<boolean> {
    return await Arweave.crypto.verify(pk, message, signature);
  }
}
