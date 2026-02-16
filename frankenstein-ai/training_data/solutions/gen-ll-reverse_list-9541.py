# Task: gen-ll-reverse_list-9541 | Score: 100% | 2026-02-13T14:09:32.119876

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))