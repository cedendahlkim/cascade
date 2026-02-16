# Task: gen-numtheory-reverse_number-6140 | Score: 100% | 2026-02-13T18:00:24.307809

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))