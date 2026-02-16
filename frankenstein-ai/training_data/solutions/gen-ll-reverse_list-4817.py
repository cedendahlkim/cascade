# Task: gen-ll-reverse_list-4817 | Score: 100% | 2026-02-15T08:15:00.835622

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))