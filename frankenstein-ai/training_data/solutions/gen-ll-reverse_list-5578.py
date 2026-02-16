# Task: gen-ll-reverse_list-5578 | Score: 100% | 2026-02-15T08:35:30.872863

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))