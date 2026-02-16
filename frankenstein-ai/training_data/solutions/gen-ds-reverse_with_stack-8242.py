# Task: gen-ds-reverse_with_stack-8242 | Score: 100% | 2026-02-14T13:12:22.468551

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))