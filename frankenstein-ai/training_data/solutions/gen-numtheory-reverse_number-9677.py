# Task: gen-numtheory-reverse_number-9677 | Score: 100% | 2026-02-15T07:54:00.952266

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))