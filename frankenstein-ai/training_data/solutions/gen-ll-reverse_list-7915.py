# Task: gen-ll-reverse_list-7915 | Score: 100% | 2026-02-15T10:50:22.451237

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))