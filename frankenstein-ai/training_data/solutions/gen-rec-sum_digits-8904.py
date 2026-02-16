# Task: gen-rec-sum_digits-8904 | Score: 100% | 2026-02-12T13:27:08.955838

def rekursiv_siffersumma(n):
    n = str(n)
    if len(n) == 1:
        return int(n)
    else:
        siffersumma = 0
        for siffra in n:
            siffersumma += int(siffra)
        return rekursiv_siffersumma(siffersumma)

n = int(input())
print(rekursiv_siffersumma(n))