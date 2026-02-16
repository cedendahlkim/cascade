# Task: gen-numtheory-reverse_number-6166 | Score: 100% | 2026-02-14T12:05:05.915161

n = int(input())
if n >= 0:
    print(int(str(n)[::-1]))
else:
    print('-' + str(int(str(abs(n))[::-1])))