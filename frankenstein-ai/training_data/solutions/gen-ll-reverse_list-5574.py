# Task: gen-ll-reverse_list-5574 | Score: 100% | 2026-02-15T10:28:44.798794

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))