# Task: gen-numtheory-reverse_number-5446 | Score: 100% | 2026-02-13T09:43:26.872324

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))