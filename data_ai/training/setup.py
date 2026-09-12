from setuptools import setup, find_packages

setup(
    name="trainer",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        "transformers==4.44.2",
        "peft==0.12.0",
        "accelerate==0.33.0",
        "trl==0.9.6",
        "datasets==2.21.0",
    ],
)
