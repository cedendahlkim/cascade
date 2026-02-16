# Task: gen-ds-reverse_with_stack-1769 | Score: 100% | 2026-02-13T14:09:15.491905

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))