# Task: gen-numtheory-reverse_number-9701 | Score: 100% | 2026-02-15T13:00:20.777803

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))