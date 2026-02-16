# Task: gen-ds-reverse_with_stack-7646 | Score: 100% | 2026-02-13T09:13:12.694418

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))