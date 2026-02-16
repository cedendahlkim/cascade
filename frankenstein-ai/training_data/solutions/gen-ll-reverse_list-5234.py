# Task: gen-ll-reverse_list-5234 | Score: 100% | 2026-02-15T09:34:32.611353

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))