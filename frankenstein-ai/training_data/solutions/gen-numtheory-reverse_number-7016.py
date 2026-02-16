# Task: gen-numtheory-reverse_number-7016 | Score: 100% | 2026-02-15T09:51:40.985965

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))