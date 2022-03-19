{
  description = "Discord twitter video embeds bot";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs";
    utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, utils }:
    utils.lib.eachDefaultSystem (system:
      let pkgs = nixpkgs.legacyPackages."${system}";
      in {
        devShell = pkgs.mkShell {
          nativeBuildInputs = with pkgs; [
            pkg-config
            nodejs-slim-16_x
            nodePackages.pnpm
            ffmpeg
            yt-dlp
          ];
        };
      });
}