# Task: gen-numtheory-reverse_number-9160 | Score: 100% | 2026-02-15T08:05:50.514705

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))