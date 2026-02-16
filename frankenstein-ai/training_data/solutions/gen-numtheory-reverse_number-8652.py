# Task: gen-numtheory-reverse_number-8652 | Score: 100% | 2026-02-13T09:34:38.737856

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))