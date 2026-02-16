# Task: gen-numtheory-reverse_number-1494 | Score: 100% | 2026-02-15T08:14:52.215345

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))