# Task: gen-numtheory-reverse_number-8313 | Score: 100% | 2026-02-13T18:37:53.309496

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))