# Task: gen-numtheory-reverse_number-9953 | Score: 100% | 2026-02-14T12:20:51.496055

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))