# Task: gen-numtheory-reverse_number-4485 | Score: 100% | 2026-02-13T09:33:14.183131

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))