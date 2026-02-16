# Task: gen-numtheory-reverse_number-9416 | Score: 100% | 2026-02-13T09:33:23.117498

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))