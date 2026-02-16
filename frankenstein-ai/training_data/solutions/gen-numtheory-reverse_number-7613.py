# Task: gen-numtheory-reverse_number-7613 | Score: 100% | 2026-02-13T18:21:07.865830

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))