# Task: gen-numtheory-reverse_number-7819 | Score: 100% | 2026-02-13T10:01:45.073052

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))