# Task: gen-numtheory-reverse_number-9611 | Score: 100% | 2026-02-15T09:01:45.058381

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))