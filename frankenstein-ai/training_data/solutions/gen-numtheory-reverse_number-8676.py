# Task: gen-numtheory-reverse_number-8676 | Score: 100% | 2026-02-13T13:09:38.653430

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))