# Task: gen-numtheory-reverse_number-8526 | Score: 100% | 2026-02-13T18:39:59.459613

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))