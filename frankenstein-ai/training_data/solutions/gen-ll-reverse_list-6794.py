# Task: gen-ll-reverse_list-6794 | Score: 100% | 2026-02-15T08:06:09.661847

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))