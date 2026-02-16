# Task: gen-numtheory-reverse_number-3920 | Score: 100% | 2026-02-15T13:00:31.783629

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))