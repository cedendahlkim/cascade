# Task: gen-numtheory-reverse_number-7486 | Score: 100% | 2026-02-15T09:34:49.014718

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))