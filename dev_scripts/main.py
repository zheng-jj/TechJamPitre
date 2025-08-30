from model.RAGLawModel import RAGLawModel


def main():
    model = RAGLawModel()
    result = model.prompt(""\
        "<feature>"\
        "Universal PF deactivation on guest mode"\
        "By default, PF will be turned off for all uses browsing in guest mode."\
        "</feature>"\
        "<terminology>"\
        "PF - Personalized feed"\
        "</terminology>"\
    )
    print(result)
    print()

if __name__ == "__main__":
    main()