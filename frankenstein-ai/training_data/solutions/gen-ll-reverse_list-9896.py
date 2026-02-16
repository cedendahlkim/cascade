# Task: gen-ll-reverse_list-9896 | Score: 100% | 2026-02-15T07:49:06.368303

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))