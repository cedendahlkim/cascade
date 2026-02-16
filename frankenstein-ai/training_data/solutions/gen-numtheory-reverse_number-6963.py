# Task: gen-numtheory-reverse_number-6963 | Score: 100% | 2026-02-13T09:33:14.468743

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))